# Production Readiness TODOs

- [ ] **PWA Icons**: Generate proper PNG icons (192x192, 512x512) and place them in `public/`. Update `vite.config.ts` to point to them.
- [ ] **Favicon**: Replace `vite.svg` with a custom favicon.
- [x] **Testing**: Expanded test coverage. Added tests for `AI Service` and `Reader` accessibility.
- [x] **Accessibility**: Added ARIA roles and keyboard support to `Reader` component.
- [ ] **Performance**: Monitor bundle size and optimize imports if necessary.
- [ ] **Security**: Run `npm audit` and fix vulnerabilities.
- [ ] **Error Tracking**: Integrate a service like Sentry for production error tracking.
