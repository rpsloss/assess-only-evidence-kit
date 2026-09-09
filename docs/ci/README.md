# Protocol CI

Copy `protocol.yml` to `.github/workflows/protocol.yml` on a machine whose GitHub token has the `workflow` scope. This kit’s OAuth push cannot create workflow files.

The recipe runs `npm test`, verifies the sample chain, emits a zip, and asserts conformance fixtures fail `ao-pack verify`.
