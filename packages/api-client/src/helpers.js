"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequest = getRequest;
exports.postRequest = postRequest;
async function getRequest(client, url, config) {
    const response = await client.get(url, config);
    return response.data;
}
async function postRequest(client, url, data, config) {
    const response = await client.post(url, data, config);
    return response.data;
}
