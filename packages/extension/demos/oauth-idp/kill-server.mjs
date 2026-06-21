#!/usr/bin/env node
import { killListenersOnPort } from '../scripts/generated/kill-listeners-on-port.mjs';

const PORT = Number(process.env.ORDERS_POSTGRESQL_OAUTH_IDP_PORT) || 4863;
killListenersOnPort(PORT, { logPrefix: 'oauth-idp:kill' });
