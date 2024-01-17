export function validateXML(
    xml: string | ReadableStream | { file: string },
    pathToXsd: string
): Promise<any>;