export async function getRequest(client, url, config) {
    const response = await client.get(url, config);
    return response.data;
}
export async function postRequest(client, url, data, config) {
    const response = await client.post(url, data, config);
    return response.data;
}
