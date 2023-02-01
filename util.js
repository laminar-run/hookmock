const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const yaml = require('js-yaml');

/**
 * Settings for the application
 */
const settings = {
    quiet: false,
    verbose: false,
    debug: false,
}

const error = (message) => {
    console.log('[ERROR]:', message);
}

const hookLog = (hookName, message) => {
    if (!settings.quiet) {
        console.log(`[${hookName}]:`, message);
    }
}

const debug = (message) => {
    if (settings.debug && !settings.quiet) {
        console.log('[DEBUG]:', message);
    }
}

const verbose = (message) => {
    if (settings.verbose && !settings.quiet) {
        console.log('[VERBOSE]:', message);
    }
}

/**
 * Load the config file
 * @param {string} filePath 
 * @returns A config object or null
 */
const loadConfig = (filePath) => {
    try {
        const yml = yaml.load(fs.readFileSync(filePath, 'utf8'));
        debug(yml);
        return yml;
    }
    catch (e) {
        console.log(`Error loading config file: ${filePath} - ${e}`);
        return null;
    }
};

/**
 * Load the environment variables from a file or process.env
 * @param {Config} config A config object
 */
const loadEnvironment = (config) => {
    if (!config) {
        error("No config loaded.");
        return;
    }

    if (!config.environment) {
        error("No environment found in config.");
        return;
    }

    const env = config.environment;

    // Load the environment from a file
    if (env?.file) {
        verbose(`Loading environment from file: ${env.file}`);
        const envFile = env.file;
        dotenv.config({ path: envFile });
    }

    // Otherwise environment is alread in the process.env
    // Reassign the environment variables to the config

    if (env?.variables) {
        const envVars = env.variables;
        for (const [key, value] of Object.entries(envVars)) {
            debug(`Checking for environment variable: ${value}`);
            const processValue = process.env[value];

            if (processValue) {
                debug(`Found environment variable: ${value}`);
                config.environment.variables[key] = processValue;
            } else {
                hookLog('Environment', `No environment variable found for: environment.variable:"${value}", in config file "${key}: ${value}". Using value ${value}`);
            }
        }
    }
}

/**
 * Inject secrets into the payload from the config
 * @param {Object} config Config object
 * @param {Object} payload Payload to inject secrets into
 * @param {Object} secrets Secrets to inject into the payload
 */
const injectSecrets = (config, payload, secrets) => {
    for (const [key, value] of Object.entries(secrets)) {
        let secret = value;

        if (value?.environment) {
            debug(`Replacing secret "${key}" with environment variable.`);
            secret = replaceSecretWithEnv(config, value.environment);
        }

        if (secret) {
            // Add the secret to the payload
            payload[key] = secret;
        }
    }
}

/**
 * Replace a secret with an environment variable
 * @param {Object} config Config object
 * @param {string} key Key of the environment variable
 * @returns The environment variable value or null
 */
const replaceSecretWithEnv = (config, key) => {
    const secret = config.environment.variables[key];
    if (secret) {
        debug(`Replacing secret with environment variable: ${key}`);
        return secret;
    }
    hookLog('Environment', `No environment variable found in config for: environment.variable:"${key}". You may need to add it to your config file.`);
    return null;
};

/**
 * Fires a webhook
 * @param {Object} config Config object
 * @param {string} hookName Name of the hook to fire
 */
const fireWebhook = (config, hookName) => {
    if (!config) {
        error("No config loaded.");
        return;
    }

    // Step 1: Get the hook
    const hook = config.hooks[hookName];

    if (!hook) {
        hookLog(hookName, `No hook found with name: ${hookName}.`);
        return;
    }

    hookLog(hookName, `Firing webhook.`);

    // Step 2: Get the server

    const server = config.servers[hook.server];

    if (!server) {
        hookLog(hookName, `No server found with name: ${hook.server}.`);
        return;
    }

    // Step 3: Get the payload

    let payload = null;

    // Check if the payload is in a file
    if (hook.payload?.file) {
        try {
            verbose(`Retrieving payload from file: ${hook.payload.body}`);
            const body = fs.readFileSync(hook.payload.body, 'utf8');
            try {
                payload = JSON.parse(body);
            } catch (e) {
                hookLog(hookName, `Error parsing payload file: ${hook.payload.body}`);
                return;
            }
        }
        catch (e) {
            hookLog(hookName, `Error loading payload file: ${hook.payload.body}`);
            return;
        }
    } else {
        payload = hook.payload?.body || {};
    }

    if (!payload) {
        verbose(`No payload found for hook: ${hookName}. Continuing without payload.`);
        payload = {};
    }

    // Step 4: Replace payload secrets with environment variables

    if (payload && hook.payload?.secrets) {
        debug(`Adding payload secrets to payload body.`)
        injectSecrets(config, payload, hook.payload.secrets)
    }

    // Step 5: Get the headers

    const headers = hook?.headers?.body || {};

    // Step 6: Replace header secrets with environment variables

    if (hook.headers?.secrets) {
        debug(`Adding header secrets to header body.`)
        injectSecrets(config, headers, hook.headers.secrets)
    }

    // Set 6: Get query params

    const queryParamsObj = hook?.queryParams?.body || {};

    if (hook.queryParams?.secrets) {
        debug(`Adding query param secrets to query param body.`)
        injectSecrets(config, queryParamsObj, hook.queryParams.secrets)
    }

    debug(`Query Params: ${JSON.stringify(queryParamsObj)}`);

    const queryParams = Object.keys(queryParamsObj).map(key => key + '=' + queryParamsObj[key]).join('&');

    const requestUrl = `${server.url}/${hook.endpoint}?${queryParams}`;

    hookLog(hookName, `Firing webhook to server: ${hook.server}::${server.name}::${requestUrl}`);

    // Step 7: Fire the webhook

    debug(`Payload: ${JSON.stringify(payload)}`);
    debug(`Headers: ${JSON.stringify(headers)}`);

    axios.post(requestUrl, payload, {
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    }).then((res) => {
        hookLog(hookName, `Webhook fired successfully.`);
        verbose(res?.data);
    }).catch((err) => {
        hookLog(hookName, `Ran into an error after webhook fired: ${err}`);
        verbose('Error data:');
        verbose(err.response?.data);
        verbose(err.response?.status);
        verbose(err.response?.headers);
    });
}

/**
 * Fires a webhook group
 * @param {Object} config Config object
 * @param {string} groupName Name of the group to fire
 */
const fireWebhookGroup = (config, groupName) => {
    if (!config) {
        error("No config loaded");
        return;
    }

    hookLog(groupName, `Firing webhook group.`);

    for (const hook of config.groups[groupName]) {
        fireWebhook(config, hook);
    }
}

/**
 * Lists all webhooks
 * @param {Object} config Config object
 */
const listWebhooks = (config) => {
    if (!config) {
        error("No config loaded");
        return;
    }

    hookLog("ls", "Webhooks:");
    for (const [key] of Object.entries(config.hooks)) {
        console.log(`- ${key}`);
    }
}

module.exports = {
    loadConfig,
    listWebhooks,
    loadEnvironment,
    fireWebhook,
    fireWebhookGroup,
    settings,
};