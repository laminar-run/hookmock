# hookmock Simple Example

This example shows a more complex usage of `hookmock`.

## Config

We have a config file `hooks.yaml` that specifies the following:

```
servers:
  my-server-1:
    name: api
    url: http://localhost:3000
hooks:
  my-hook-1:
    server: my-server-1
    endpoint: webhooks/your-webhook-endpoint
    payload:
      body:
        text: Hey from Hookmock!
```

Servers:
- api (http://localhost:3000)

Hooks:
- **my-hook-1**: `webhooks/your-webhook-endpoint/`
    - Sends a hook to `my-server-1`
    - Endpoint: `webhooks/your-webhook-endpoint/`
        - The request will be sent to `http://localhost:3000/webhooks/your-webhook-endpoint/`
    - Payload is read from the `hooks.yaml` file since `file: true` is not set.
    - No secrets are used.

## Running

We can run this configuration in our terminal in the root of our project:

```
hookmock fire my-hook-1
```

In this case, no `-c` option is required to specify config file since we're using the default `hooks.yaml` config file.