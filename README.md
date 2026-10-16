# SecureSouls Worker

Rust-based backend running on Cloudflare Workers.

## Development & Testing

You can test the application locally or deploy a preview version to Cloudflare:

### Local Development
Run a local development server with hot-reloading:
```bash
npx wrangler dev
```
### Cloudflare Staging Preview
Deploy a preview build to Cloudflare without affecting production:
```bash
npx wrangler deploy --env dev
```