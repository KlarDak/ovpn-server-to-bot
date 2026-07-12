/**
 * Interface representing the structure of a response configuration object. This interface defines the properties that a response configuration should have, including a numeric status code, a message string, and an optional data property that can hold any additional information related to the response. The code property indicates the HTTP status code of the response, while the message property provides a descriptive message about the response. The data property can be used to include any relevant data or information that needs to be sent back to the client as part of the response.
 */
export interface IResponseConfig {
    code: number; // HTTP status code of the response
    message: string; // Descriptive message about the response
    data?: any; // Optional property to include any additional data related to the response
}