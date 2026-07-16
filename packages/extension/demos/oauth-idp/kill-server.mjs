#!/usr/bin/env node
import { killListenersOnPort } from '../generated/db2ai/scripts/kill-listeners-on-port.mjs';

const PORT = Number(process.env.ORDERS_POSTGRESQL_OAUTH_IDP_PORT) || 4863;
killListenersOnPort(PORT, { logPrefix: 'oauth-idp:kill' });
