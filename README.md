# hookmock

Mock webhooks locally.

## Why?

Testing webhooks locally can be a pain, especially if your app relies on webhooks to function (at least I found).

I needed to test a webhook integration locally, but I didn't want to have to set up a server to send the webhook. The payloads I needed to test with varied in size and complexity, so I needed a way to create a set of mock payloads that I could send to my local server.

## How?

`hookmock` is a simple CLI tool that allows you to mock a webhook request locally. You can create a set of mock payloads, send a mock webhook to a local server, and view the mock webhook payload.

## Installation

You can install `hookmock` using `npm`:

```bash
npm install -g hookmock
```

You can also install `hookmock` using `yarn`:

```bash
yarn global add hookmock
```

## Examples

Take a look at some `hookmock` examples here:

* [Creating a simple hookmock setup with one hook and one server]()
* [Creating a more complex hookmock setup with multiple hooks, separate payloads, servers, groups, and environment variables]()

## Usage

### Getting started

Route a webhook from `hookmock` to your local server using the `hookmock` `hooks.yaml` file, and create a mock payload to be sent.

Here's an example `hooks.yaml` file:

```yaml
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
        text: Hello World!
```

Once you've created a `hooks.yaml` file, you can create a mock payload using the `hookmock` CLI:

> Make sure to run this in the root of your project. (`hooks.yaml` should be in the same directory)

```bash
hookmock fire my-hook-1
```

This will send a mock webhook to your local server, and you can view the mock webhook payload in your terminal.

You should see that a request was sent to your local server with a payload that looks like this:

```json
{
  "text": "Hello World!"
}
```

## Configuration

By default, `hookmock` will look for a `hooks.yaml` file in the folder it is being run unless a config file is specified with the `-c` or `--config` option.

`hookmock` requires a config file to be specified/exist to run properly.

The `hookmock` config file is written in `YAML`, and consists of the following:

### Environment `environment`

This section of the configuration file contains variables that `hookmock` should load in from the environment.

> Note: This section of the configuration file is not required for `hookmock` to run, but helps if you're passing secret values while testing.

You can declare environment variables to be used with the `variables` option:

```yaml
environment
  variables:
    <variable-name>: <corresponding-env-variable-name>
```

Example:

```yaml
environment
  variables:
    token: TOKEN
```

**IMPORTANT** The values of each entry specified in the `environment.variables` section should correspond to the **related environment variable name** (i.e. for entry `token: TOKEN`, value is `TOKEN`, therefore my OS env has a variable called `TOKEN` whose value `hookmock` will use.)

By default, `hookmock` reads variables from the OS (process.env).

You can specify a file with the `file` option:

```yaml
environment:
  file: my.env
  variables:
    token: TOKEN
```

In this case `hookmock` will look for the value of `TOKEN` in the `my.env` file.

### Servers `servers`

This section of the configuration file contains the data about the servers that your hooks will be referencing.

You can specify the `servers` that `hooks` should be able to send requests to using the following format:

```yaml
servers:
  <server-reference-name>:
    name: <server-name>
    url: <server-url>
```

**IMPORTANT** When you specify a `server` for a `hook` you'll reference the `server` by the `server-reference-name` specified under `servers`, NOT `server-name`.

Example:

```yaml
servers:
  api-server:
    name: my-api
    url: http://localhost:3000
```

In this case you have a server that you'll reference in your config file as `api-server`, but you've given it a name: `my-api`.

### Hooks `hooks`

This section of the configuration file contains all your hooks.

By default, when a hook is fired, a `POST` request is made to the `server` it references, along with the `headers` and `payload` you specified in the config file.

You can specify `hooks` in the following format:

```yaml
hooks:
  <hook-reference-name>:
    server: <server-reference-name>

    # Specifies the endpoint for the hook
    endpoint: some/endpoint

    # Optional -- add headers to your hook request, merges `body` and `secrets` to create a `headers` object
    headers: 
      # Optional -- add some non-secret headers to your headers object
      body:
        <header-key>: <header-value>
        ...
      # Optional -- add secrets to your header object from your environment or in plaintext
      secrets:
        # References secrets from environment by adding `environment` key
        <some-secret-header-key>:
          environment: <environment-variable-declared-in-environment-referencing-the-correct-secret>
        # If we have a secret that is not an environment secret, we can simply add it as a key, value entry to `secrets`
        <some-secret-header-key>: <some-non-environment-secret>
      ...
    
    # Optional -- send a payload to with your webhook
    payload:
      # Optional, specifies if payload comes from a `.json` file or not.
      # Default value if `file` is not specified is `false`
      file: true | false 
      # Optional, either declares a body for the hook payload,
      # or, if `file` is `true`, then specifies the path to the payload file

      # Case 1: `file`: true
      body: mocks/api/api_webhook.json

      # Case 2: `file`: false or no `file` key
      body: 
        <payload-key>: <payload-value>
        ...

      # Optional -- add secrets to your payload object from your environment or in plaintext
      secrets:
        # References secrets from environment by adding `environment` key
        <some-secret-payload-key>:
          environment: <environment-variable-declared-in-environment-referencing-the-correct-secret>
        # If we have a secret that is not an environment secret, we can simply add it as a key, value entry to `secrets`
        <some-secret-header-key>: <some-non-environment-secret>
```

**IMPORTANT** For hooks `header`, and `payload`, `hookmock` will combine the `body` and `secrets` into one object to pass in the request to the specified server. Try not to have any `key` overlap.

Here are a few examples:

Basic Hook:

```yaml
hooks:
  health:
    server: health-server
    endpoint: healthcheck/
    payload:
      body:
        alive: true
```

Hook with Payload and Headers:

```yaml
hooks:
  worker:
    server: worker-server
    endpoint: worker/start
    headers: 
      body: 
        worker-id: worker-1
      secrets:
        Authorization:
          environment: token
        PublicSecret: I'm a public secret!
    payload:
      body:
        text: Hello from Hookmock!
```

Hook with Payload from external file:

```yaml
hooks:
  api:
    server: api-server
    endpoint: api/start-worker
    headers: 
      secrets:
        Authorization:
          environment: token
    payload:
      file: true
      body: mocks/api/api_webhook.json
      secrets:
        webhook_key:
          environment: webhook_key
```

### Groups `groups`

You can specify a `group` to fire an array of `hooks`

```yaml
groups:
  <group-reference-name>:
    - <hook-reference-name>
```

Example:

```yaml
groups:
  full-stack:
    - api
    - worker
    - health
```

In this case when you call `hookmock fire-group full-stack`, the `api`, `worker`, and `health` hooks will be dispatched.

## Commands

### `fire <hooks...>`

Fires webhooks from one or more hooks specified in the `hooks` argument.

### Example:

```bash
hookmock fire-group api-hook-1 worker-hook-1
```

### `fire-group <groups...>`

Fires webhooks from one or more groups specified in the `groups` argument.

#### Example:

```bash
hookmock fire-group api worker
```

### `ls`

Lists all hooks from the specified config file or `hooks.yaml` if no config file specified.

## Troubleshooting

To ensure you're running `hookmock` is in the right place, run `hookmock ls` and see if there are any issues!

### Logging

You can run `hookmock fire` or `hookmock fire-group` with the following options:

* `-q, --quiet` for absolutely no output from `hookmock`
* `-d, --debug` for debug logs from `hookmock`
* `-v, --verbose` for verbose logs from `hookmock`