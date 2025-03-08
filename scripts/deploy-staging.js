/**
 * Script to deploy application to staging environment
 * This script is used before running E2E tests to ensure a real AWS environment
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Log with timestamp
function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

// Main deployment function
async function deployToStaging() {
  try {
    log('Starting deployment to staging environment...', colors.cyan);
    
    // Check if we're already in a CI environment
    const isCI = process.env.CI === 'true';
    
    if (!isCI) {
      // Make sure all changes are committed before deploying
      try {
        const status = execSync('git status --porcelain').toString();
        if (status.trim()) {
          log('WARNING: You have uncommitted changes. Deployment will include these changes.', colors.yellow);
          // Prompt for confirmation if running interactively
          if (process.stdin.isTTY) {
            const readline = require('readline').createInterface({
              input: process.stdin,
              output: process.stdout
            });
            
            const answer = await new Promise(resolve => {
              readline.question('Continue with deployment? (y/N) ', resolve);
            });
            
            readline.close();
            
            if (answer.toLowerCase() !== 'y') {
              log('Deployment canceled.', colors.red);
              process.exit(1);
            }
          }
        }
      } catch (err) {
        log('Could not check git status. This might not be a git repository.', colors.yellow);
      }
    }
    
    // Run tests to make sure everything passes before deployment
    log('Running tests before deployment...', colors.cyan);
    execSync('npm test', { stdio: 'inherit' });
    
    // Deploy to staging
    log('Deploying to staging environment...', colors.cyan);
    execSync('npx arc deploy --staging', { stdio: 'inherit' });
    
    // Get deployed URL from Architect
    const arcConfig = path.join(process.cwd(), '.arc-config');
    let stagingUrl;
    
    if (fs.existsSync(arcConfig)) {
      try {
        const configData = fs.readFileSync(arcConfig, 'utf8');
        const urlMatch = configData.match(/staging\s+url\s+(\S+)/);
        if (urlMatch && urlMatch[1]) {
          stagingUrl = urlMatch[1];
        }
      } catch (err) {
        log('Could not read .arc-config file', colors.yellow);
      }
    }
    
    if (!stagingUrl) {
      // Try to get URL from CloudFormation outputs
      try {
        const stackOutput = execSync('aws cloudformation describe-stacks --stack-name splayspace-staging --query "Stacks[0].Outputs[?OutputKey==\'URL\'].OutputValue" --output text').toString().trim();
        if (stackOutput) {
          stagingUrl = stackOutput;
        }
      } catch (err) {
        log('Could not get staging URL from CloudFormation outputs', colors.yellow);
      }
    }
    
    if (stagingUrl) {
      // Write the URL to a file so the test script can use it
      fs.writeFileSync(path.join(process.cwd(), '.staging-url'), stagingUrl);
      log(`Deployment successful! Staging URL: ${stagingUrl}`, colors.green);
      
      // Compute WebSocket URL
      const wsUrl = stagingUrl.replace(/^https?:/, 'wss:');
      fs.writeFileSync(path.join(process.cwd(), '.staging-ws-url'), wsUrl);
      log(`WebSocket URL: ${wsUrl}`, colors.green);
    } else {
      log('Deployment completed, but could not determine the staging URL.', colors.yellow);
    }
    
    // Return success
    return 0;
  } catch (error) {
    log(`Deployment failed: ${error.message}`, colors.red);
    return 1;
  }
}

// Run the deployment
if (require.main === module) {
  deployToStaging().then(exitCode => {
    process.exit(exitCode);
  });
}

module.exports = { deployToStaging };
