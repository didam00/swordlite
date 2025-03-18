import { serve } from "bun";

serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    let filePath;

    if (url.pathname === '/') {
      filePath = 'index.html';
    } else {
      filePath = url.pathname.substring(1);
    }

    try {
      const file = Bun.file(filePath);
      return new Response(file);
    } catch (e) {
      console.error(e);
      return new Response('Not Found', { status: 404 });
    }
  }
});

console.log('Server running at http://localhost:3000/');