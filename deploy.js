const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Helper script to deploy with proper WebSocket configuration
 */
async function deploy() {
  console.log('Deploying SplaySpace with WebSocket configuration...');
  
  try {
    // Deploy the application first to create/update resources
    console.log('Running initial deployment...');
    execSync('npx arc deploy --staging', { stdio: 'inherit' });
    
    // Get the API Gateway WebSocket API ID from the deployment output
    const stackName = 'splayspace-staging';
    console.log(`Getting WebSocket API ID from stack ${stackName}...`);
    
    const cfnOutput = execSync(
      `aws cloudformation describe-stacks --stack-name ${stackName} --query "Stacks[0].Outputs[?OutputKey=='WebSocketApiId'].OutputValue" --output text`,
      { encoding: 'utf8' }
    );
    
    const websocketApiId = cfnOutput.trim();
    console.log(`WebSocket API ID: ${websocketApiId}`);
    
    if (!websocketApiId) {
      throw new Error('Could not get WebSocket API ID from CloudFormation');
    }
    
    // Write the WebSocket API ID to a preferences file for future deployments
    const preferences = {
      WEBSOCKET_API_ID: websocketApiId
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'preferences.arc'),
      Object.entries(preferences)
        .map(([key, value]) => `@${key}\n${value}`)
        .join('\n\n')
    );
    
    console.log('WebSocket API ID saved to preferences.arc');
    
    // Now redeploy with the WebSocket API ID to ensure proper configuration
    console.log('Redeploying with WebSocket API ID...');
    execSync(`WEBSOCKET_API_ID=${websocketApiId} npx arc deploy --staging`, { stdio: 'inherit' });
    
    // Get the API Gateway URL
    const apiUrl = execSync(
      `aws cloudformation describe-stacks --stack-name ${stackName} --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" --output text`,
      { encoding: 'utf8' }
    ).trim();
    
    console.log(`Deployment complete!`);
    console.log(`API URL: ${apiUrl}`);
    console.log(`WebSocket URL: wss://${websocketApiId}.execute-api.us-west-2.amazonaws.com/staging`);
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

// Run the deployment
deploy().catch(console.error);
