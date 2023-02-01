# hookmock

Mock webhooks locally.

## Why?

Testing webhooks locally can be a pain, especially if your app relies on webhooks to function (at least I found).

I needed to test a webhook integration locally, but I didn't want to have to set up a server to send the webhook. The payloads I needed to test with varied in size and complexity, so I needed a way to create a set of mock payloads that I could send to my local server.

## How?

`hookmock` is a simple CLI tool that allows you to mock a webhook request locally. You can create a set of mock payloads, send a mock webhook to a local server, and view the mock webhook payload.

Route a webhooks from `hookmock` to your local server using the `hookmock` `hooks.yaml` file, and create a mock payload to be sent.

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

## Installation

You can install `hookmock` using `npm`:

```bash
npm install -g hookmock
```

You can also install `hookmock` using `yarn`:

```bash
yarn global add hookmock
```