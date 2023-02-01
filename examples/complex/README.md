# hookmock Complex Example

This example shows a more complex usage of `hookmock`.

## Config

We have a config file `hooks.yaml` that specifies the following:

Environment:
- File: `hooks.env`
    - The `hooks.env` file is used to store secrets that are used in the `hooks.yaml` file.
    - Since a file is specified for our environment, the `hooks.env` file will be read and the values will be used in the `hooks.yaml` file instead of `process.env`.
- Variables:
    - `BEARER_TOKEN`: Brought in from the `hooks.env` file.
    - `WORKER_TOKEN`: Brought in from the `hooks.env` file.
    - `API_TOKEN`: Brought in from the `hooks.env` file.

Servers:
  - api-server (http://localhost:3000)
  - worker-server (http://localhost:5000)
  - health-server (http://localhost:7000)

Hooks:
- **api**: 
    - Sends a hook to `api-server`
    - Endpoint: `api/start-worker` 
        - The request will be sent to `http://localhost:3000/api/start-worker`
    - Headers are all secret and therefore are all brought in from the `hooks.env` file.
        - The two headers are `Authorization` and `worker_token`.
        - On runtime the values in the `hooks.yaml` file will be replaced with the values in the `hooks.env` file.
    - Payload is brought in from the `api/api_webhook.json` file, and has secrets that are brought in from the `hooks.env` file.
        - The `file: true` option is set to true, which means that the payload will be read from the file and not from the `hooks.yaml` file.
        - Secrets will be added to the payload from the `hooks.env` file.
- **worker**: `worker/start`
    - Sends a hook to `worker-server`
    - Endpoint: `worker/start`
        - The request will be sent to `http://localhost:5000/worker/start`
    - Payload is brought in from the `worker/worker_webhook.json` file, and has secrets that are brought in from the `hooks.env` file.
        - The `file: true` option is set to true, which means that the payload will be read from the file and not from the `hooks.yaml` file.
        - Secrets will be added to the payload from the `hooks.env` file, and `PublicToken` will be pulled directly from the config file.
- **health**: `healthcheck/`
    - Sends a hook to `health-server`
    - Endpoint: `healthcheck/`
        - The request will be sent to `http://localhost:7000/healthcheck/`
    - Payload is read from the `hooks.yaml` file since `file: true` is not set.
    - No secrets are used.
    - Query Params: We send `worker-1` as a query param in the request.

Groups:
- all: [api, worker, health]
- mailer: [api, worker]

## Running

### Hook

We can run this configuration in our terminal in the root of our project:

```
hookmock fire api
```

In this case, no `-c` option is required to specify config file since we're using the default `hooks.yaml` config file.

### Group

We can also fire webhooks to group using:

```
hookmock fire-group all
```

This will fire hooks: `api`, `worker`, and `health`.