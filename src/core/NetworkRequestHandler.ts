import CredentialManager from "./CredentialManager";
import { Servers } from "../constants/Servers";
import { HttpMethods, Result } from "./types";

/**
 * Responsible for calling the OpenSubtitles API. Every library method is a fancy wrapper
 * around this class in order to pass in the necessary information.
 */
class NetworkRequestHandler {
    private credentialManager: CredentialManager;
    private readonly serverAddress: string;

    constructor(credentialManager: CredentialManager, endpoint?: Servers) {
        this.credentialManager = credentialManager;
        this.serverAddress = endpoint ?? Servers.PRIMARY;
    }

    /**
     * Perform the actual network request, and wrap the return object into a Result type.
     *
     * @param httpMethod {HttpMethods} To use for the API call.
     * @param endpoint OpenSubtitles API endpoint to call, starts with a slash.
     * @param includeApiKey Flag indicating if the API key should be included in the headers.
     * @param headers Object of all headers to include in the request.
     * @param data Data object to send in the body of the request.
     * @return {Result} wrapped response from all endpoint requests.
     */
    performNetworkCall = async (httpMethod: HttpMethods, endpoint: string, includeApiKey: boolean, headers: HeadersInit, data?: object): Promise<Result<any>> => {
        const url = this.serverAddress + endpoint;
        const apiKey = includeApiKey ? this.credentialManager.getUserCredentials().apiKey : undefined;
        const requestHeaders = new Headers(headers);
        if (apiKey) {
            requestHeaders.append("Api-Key", apiKey);
        }

        const fetchOptions = {
            method: httpMethod,
            headers: requestHeaders,
            body: data ? JSON.stringify(data) : null
        };

        // Ensure 'GET' requests do not have a 'body'
        if (httpMethod === HttpMethods.GET) {
            // @ts-ignore
            delete fetchOptions.body;
        }

        try {
            const response = await fetch(url, fetchOptions);
            const responseData = await response.json();
            if (response.ok) {
                return { ok: true, value: responseData };
            } else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        } catch (error) {
            if (error instanceof Error){
                return { ok: false, error: error.message as any };
            }
            return { ok: false, error: new Error(String(error)) };
        }
    }
}

export default NetworkRequestHandler;
