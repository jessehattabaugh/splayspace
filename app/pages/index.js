export default function Index({ wsUrl }) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>SplaySpace - An infinite world to explore</title>
        <link rel="stylesheet" href="/_public/styles.css">
        <link rel="icon" href="/_public/favicon.ico">
        <meta name="description" content="Explore an infinite world with friends in SplaySpace">
        <script>
          // Set WebSocket URL from server-side data
          window.WS_URL = "${wsUrl}";
        </script>
      </head>
      <body>
        <main>
          <header-component></header-component>
          
          <game-container></game-container>
          
          <hud-overlay></hud-overlay>
          
          <chat-panel></chat-panel>
          
          <inventory-panel></inventory-panel>
          
          <art-editor></art-editor>
          
          <loading-screen></loading-screen>
          
          <footer-component></footer-component>
        </main>
        
        <script type="module" src="/_public/browser/index.mjs"></script>
      </body>
    </html>
  `;
}
