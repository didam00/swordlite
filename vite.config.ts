import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true, // 개발 서버 실행 시 브라우저 자동 열기
  },
  resolve: {
    alias: {
      '@': '/src', // src 폴더를 @로 참조 가능
    },
  },
});