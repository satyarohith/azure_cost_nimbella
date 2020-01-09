'use strict';

/**
 * @description Says "Hello, world!" or "Hello, <name>" when the name is provided.
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params, commandText, secrets = {}) {
  const {azClientId, azClientSecret, azTenantId, azSubscriptionId} = secrets;

  if (!azClientId || !azClientSecret || !azTenantId || !azSubscriptionId) {
    return {
      // Or `ephemeral` for private response
      response_type: 'in_channel', // eslint-disable-line camelcase
      text: `You need \`azClientId\`, \`azClientSecret\`, \`azTenantId\` & \`azSubscriptionId\` secrets to run this command. Create them using \`/nc secret_create\``
    };
  }

  // This array is used to store slack blocks.
  const result = [];
  const MsRest = require('ms-rest-azure');
  const BillingManagement = require('azure-arm-billing');
  try {
    const {promisify} = require('util');

    const loginAsync = promisify(MsRest.loginWithServicePrincipalSecret).bind(
      MsRest
    );

    const credentials = await loginAsync(
      azClientId,
      azClientSecret,
      azTenantId
    );

    const client = new BillingManagement(credentials, azSubscriptionId);
    const listAsync = promisify(client.invoices.list).bind(client.invoices);
    const invoices = await listAsync();
    console.log(invoices);
  } catch (error) {
    console.error(error.message);
  }

  return {
    // Or `ephemeral` for private response
    response_type: 'in_channel', // eslint-disable-line camelcase
    blocks: result
  };
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async ({__secrets = {}, commandText, ...params}) => ({
  body: await _command(params, commandText, __secrets)
});
module.exports = main;
