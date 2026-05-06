import * as command from "@pulumi/command";
import * as hcloud from "@pulumi/hcloud";
import * as pulumi from "@pulumi/pulumi";
import * as crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const config = new pulumi.Config();
const deployType = config.require("deployType");
const sshKeyName = config.require("sshKeyName");
const sshKeyPath = path.join(os.homedir(), ".ssh", sshKeyName);

let privateKeyRaw: string;
try {
  privateKeyRaw = fs.readFileSync(sshKeyPath, "utf-8");
} catch {
  throw new Error(`SSH private key not found at ${sshKeyPath}. Set sshKeyName in stack config.`);
}
const privateKey = pulumi.secret(privateKeyRaw);

export let serverIp: pulumi.Output<string> | undefined;

// ==========================================
// MODE 1: INFRASTRUCTURE (Traefik on existing server)
// ==========================================
if (deployType === "infra") {
  const server = new hcloud.Server(
    "emsa-server",
    {
      image: "ubuntu-24.04",
      location: "nbg1",
      name: "ubuntu-4gb-nbg1-1",
      serverType: "cax11",
      sshKeys: [sshKeyName],
    },
    {
      protect: true,
      ignoreChanges: ["sshKeys", "allowDeprecatedImages", "ignoreRemoteFirewallIds"],
    }
  );

  new hcloud.Firewall(
    "emsa-firewall",
    {
      name: "emsa-firewall",
      rules: [
        { direction: "in", protocol: "tcp", port: "22", sourceIps: ["0.0.0.0/0", "::/0"] },
        { direction: "in", protocol: "tcp", port: "80", sourceIps: ["0.0.0.0/0", "::/0"] },
        { direction: "in", protocol: "tcp", port: "443", sourceIps: ["0.0.0.0/0", "::/0"] },
        { direction: "in", protocol: "icmp", sourceIps: ["0.0.0.0/0", "::/0"] },
      ],
      applyTos: [{ server: server.id.apply((id) => parseInt(id, 10)) }],
    },
    { dependsOn: [server] }
  );

  const connection = { host: server.ipv4Address, user: "root", privateKey };

  const installDocker = new command.remote.Command("install-docker", {
    connection,
    create: `
      if ! command -v docker &>/dev/null; then
        apt-get update -y
        apt-get install -y ca-certificates curl gnupg lsb-release
        install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        chmod a+r /etc/apt/keyrings/docker.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
        apt-get update -y
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        systemctl enable docker
        systemctl start docker
      fi
      docker network create emsa-shared 2>/dev/null || true
    `,
  });

  const setupTraefik = new command.remote.Command(
    "setup-traefik",
    {
      connection,
      create: "mkdir -p /root/traefik",
    },
    { dependsOn: [installDocker] }
  );

  const traefikComposeHash = crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.join(__dirname, "docker/traefik/docker-compose.yml")))
    .digest("hex")
    .substring(0, 8);

  const copyTraefikCompose = new command.remote.CopyToRemote(
    "copy-traefik-compose",
    {
      connection,
      source: new pulumi.asset.FileAsset(path.join(__dirname, "docker/traefik/docker-compose.yml")),
      remotePath: "/root/traefik/docker-compose.yml",
      triggers: [traefikComposeHash],
    },
    { dependsOn: [setupTraefik] }
  );

  new command.remote.Command(
    "start-traefik",
    {
      connection,
      create: "cd /root/traefik && docker compose up -d",
      update: "cd /root/traefik && docker compose pull && docker compose up -d",
      triggers: [traefikComposeHash],
    },
    { dependsOn: [copyTraefikCompose] }
  );

  serverIp = server.ipv4Address;
}

// ==========================================
// MODE 2: APPLICATION (per environment)
// ==========================================
if (deployType === "app") {
  const envName = pulumi.getStack();
  const dbHostPortByEnv: Record<string, string> = { prod: "5432", dev: "5433" };
  const dbHostPort = dbHostPortByEnv[envName];
  if (!dbHostPort) {
    throw new Error(`Unknown stack "${envName}". Add it to dbHostPortByEnv in infra/index.ts.`);
  }
  const domain = config.require("domain");

  const dbPassword = config.requireSecret("dbPassword");
  const jwtSecret = config.requireSecret("jwtSecret");
  const googleClientId = config.requireSecret("googleClientId");
  const googleClientSecret = config.requireSecret("googleClientSecret");
  const awsAccessKeyId = config.requireSecret("awsAccessKeyId");
  const awsSecretAccessKey = config.requireSecret("awsSecretAccessKey");
  const awsRegion = config.get("awsRegion") ?? "eu-north-1";
  const awsS3Bucket = config.get("awsS3Bucket") ?? "emsa-bucket";
  const resendApiKey = config.requireSecret("resendApiKey");
  const fromEmail = config.get("fromEmail") ?? "noreply@emsa.mk";

  const pulumiOrg = config.require("pulumiOrg");
  const infraStack = new pulumi.StackReference(`${pulumiOrg}/emsa/infra`);
  const infraServerIp = infraStack.getOutput("serverIp") as pulumi.Output<string>;

  const appHash = getContentHash(path.join(__dirname, ".."), [
    "src",
    "drizzle",
    "package.json",
    "bun.lock",
    "build.ts",
    "Dockerfile",
    "tsconfig.json",
    "drizzle.config.ts",
  ]);

  const composeHash = crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.join(__dirname, "docker/app/docker-compose.yml")))
    .digest("hex")
    .substring(0, 8);

  const appDir = `/root/apps/${envName}`;
  const connection = { host: infraServerIp, user: "root", privateKey };

  const mkDir = new command.remote.Command(`mkdir-${envName}`, {
    connection,
    create: `mkdir -p ${appDir}`,
  });

  // --delete-after removes files only after a successful transfer, so the
  // destination is never left empty if rsync fails partway through.
  const syncCode = new command.local.Command(
    `sync-code-${envName}`,
    {
      create: pulumi.interpolate`rsync -az --delete-after \
        --exclude=node_modules \
        --exclude=dist \
        --exclude=.git \
        --exclude=.claude \
        --exclude=.vscode \
        --exclude=.env \
        --exclude=infra \
        -e "ssh -o StrictHostKeyChecking=no -i ${sshKeyPath}" \
        ${path.join(__dirname, "../")} root@${infraServerIp}:${appDir}/`,
      triggers: [appHash],
    },
    { dependsOn: [mkDir] }
  );

  // copyCompose and writeEnv must run AFTER syncCode — rsync --delete-after
  // would otherwise remove files placed on the server before the sync runs.
  const copyCompose = new command.remote.CopyToRemote(
    `copy-compose-${envName}`,
    {
      connection,
      source: new pulumi.asset.FileAsset(path.join(__dirname, "docker/app/docker-compose.yml")),
      remotePath: `${appDir}/docker-compose.yml`,
      triggers: [appHash, composeHash],
    },
    { dependsOn: [syncCode] }
  );

  const envFileCmd = pulumi.interpolate`cat > ${appDir}/.env << 'ENVEOF'
ENV_NAME=${envName}
DOMAIN=${domain}
PORT=3000
ENV=${envName === "prod" ? "production" : "development"}
DB_HOST=postgres-${envName}
DB_PORT=5432
DB_HOST_PORT=${dbHostPort}
DB_USER=emsa
DB_PASS=${dbPassword}
DB_NAME=emsa_${envName}
DB_SCHEMA=public
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=${googleClientId}
GOOGLE_CLIENT_SECRET=${googleClientSecret}
GOOGLE_REDIRECT_URI=https://${domain}/api/auth/google/callback
APP_URL=https://${domain}
AWS_ACCESS_KEY_ID=${awsAccessKeyId}
AWS_SECRET_ACCESS_KEY=${awsSecretAccessKey}
AWS_REGION=${awsRegion}
AWS_S3_BUCKET=${awsS3Bucket}
RESEND_API_KEY=${resendApiKey}
FROM_EMAIL=${fromEmail}
ENVEOF`;

  const writeEnv = new command.remote.Command(
    `write-env-${envName}`,
    {
      connection,
      create: envFileCmd,
      update: envFileCmd,
      triggers: [appHash],
    },
    { dependsOn: [syncCode] }
  );

  serverIp = infraServerIp;

  // Triggers cause replacement, so `update` rarely fires — both branches
  // use the same command and rely on Docker's layer cache for incremental builds.
  const deployCmd = pulumi.interpolate`
    cd ${appDir}
    ENV_NAME=${envName} DOMAIN=${domain} docker compose -p emsa-${envName} build
    ENV_NAME=${envName} DOMAIN=${domain} docker compose -p emsa-${envName} up -d
  `;
  const deploy = new command.remote.Command(
    `deploy-${envName}`,
    {
      connection,
      create: deployCmd,
      update: deployCmd,
      triggers: [appHash, composeHash],
    },
    { dependsOn: [syncCode, copyCompose, writeEnv] }
  );

  new command.remote.Command(
    `migrate-${envName}`,
    {
      connection,
      create: pulumi.interpolate`
        for i in $(seq 1 20); do
          echo "Migration attempt $i/20..."
          if docker exec app-${envName} bunx drizzle-kit migrate 2>&1; then
            echo "Migrations applied successfully"
            exit 0
          fi
          sleep 3
        done
        echo "Migrations failed after 20 attempts" >&2
        exit 1
      `,
      triggers: [appHash],
    },
    { dependsOn: [deploy] }
  );
}

function getContentHash(root: string, relPaths: string[]): string {
  const hash = crypto.createHash("sha256");
  const ignoreList = ["node_modules", ".git", "dist", "infra"];

  const walk = (currentPath: string) => {
    const rel = path.relative(root, currentPath);
    if (ignoreList.some((ig) => rel.split(path.sep).includes(ig))) return;

    const stats = fs.statSync(currentPath);
    if (stats.isDirectory()) {
      for (const file of fs.readdirSync(currentPath).sort()) {
        walk(path.join(currentPath, file));
      }
    } else {
      hash.update(rel);
      hash.update(fs.readFileSync(currentPath));
    }
  };

  for (const relPath of relPaths) {
    const full = path.join(root, relPath);
    if (fs.existsSync(full)) walk(full);
  }

  return hash.digest("hex").substring(0, 8);
}
