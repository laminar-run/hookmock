#! /usr/bin/env node
const { program } = require('commander')

const { fireWebhook, fireWebhookGroup, listWebhooks, loadConfig, loadEnvironment, settings } = require('./util.js')

program
    .name('hookmock')
    .description("Mock webhooks locally.")
    .version('0.1.0');

program
    .command('fire <hooks...>')
    .description('Fire webhooks')
    .option('-c, --config <path>', 'Path to config file')
    .option('-q, --quiet', 'Suppress output', false)
    .option('-v, --verbose', 'Verbose output', false)
    .option('-d, --debug', 'Debug output', false)
    .action((hooks, options) => {
        settings.quiet = options.quiet;
        settings.verbose = options.verbose;
        settings.debug = options.debug;

        let configFile = options.config;

        if (!options.config) {
            console.log('No config file specified.');
            console.log('Using default config file: hooks.yaml');
            configFile = 'hooks.yaml';
        }

        const config = loadConfig(configFile);

        if (config) {
            if (config?.environment) {
                loadEnvironment(config);
            }

            hooks.forEach(hook => {
                fireWebhook(config, hook);
            });
        }
    });

program
    .command('fire-group <groups...>')
    .description('Fire a group of webhooks')
    .option('-c, --config <path>', 'Path to config file')
    .option('-q, --quiet', 'Suppress output', false)
    .option('-v, --verbose', 'Verbose output', false)
    .option('-d, --debug', 'Debug output', false)
    .action((groups, options) => {
        settings.quiet = options.quiet;
        settings.verbose = options.verbose;
        settings.debug = options.debug;

        let configFile = options.config;

        if (!options.config) {
            console.log('No config file specified.');
            console.log('Using default config file: hooks.yaml');
            configFile = 'hooks.yaml';
        }

        const config = loadConfig(configFile);

        if (config) {
            if (config?.environment) {
                loadEnvironment(config);
            }

            groups.forEach(group => {
                fireWebhookGroup(config, group);
            });
        }
    });


program
    .command('ls')
    .description('List all webhooks')
    .option('-c, --config <path>', 'Path to config file')
    .action((options) => {
        settings.verbose = false;
        settings.debug = false;

        let configFile = options.config;

        if (!options.config) {
            console.log('No config file specified.');
            console.log('Using default config file: hooks.yaml');
            configFile = 'hooks.yaml';
        }

        const config = loadConfig(configFile);

        listWebhooks(config);
    });

program.parse()