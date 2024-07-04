import type { OpenAPI } from 'openapi-types';

type Data = {
  securityDefinitions: {
    api_key: {
      name: string,
      in: string
    }
  },
  paths: [
    {
      parameters: {
        in: 'path' | 'query',
        name: string
      }[]
    }[]
  ]
}

type Test = {
  name: string,
  description: string,
  path: string,
  consumes: string[],
  produces: string[],
  params: unknown,
  headers: Record<string, string>[],
  code: string
}

function generateHeaders(
  path: { consumes: string[]; produces: string[], security: string[] },
  data: Data
) {
  const contentTypes = path.consumes || [];
  const acceptTypes = path.produces || [];
  const headers: Array<Record<string, string>> = [];
  if (contentTypes.length > 0) {
    if (contentTypes.indexOf("application/json") >= 0) {
      headers.push({
        key: "Content-type",
        value: "application/json",
      });
    } else {
      headers.push({
        key: "Content-type",
        value: contentTypes[0],
      });
    }
  }

  if (acceptTypes.length > 0) {
    if (acceptTypes.indexOf("application/json") >= 0) {
      headers.push({
        key: "Accept",
        value: "application/json",
      });
    } else {
      headers.push({
        key: "Accept",
        value: acceptTypes[0],
      });
    }
  }

  if (
    path.security &&
    data.securityDefinitions &&
    data.securityDefinitions.api_key &&
    data.securityDefinitions.api_key.in === "header"
  ) {
    headers.push({
      key: `${data.securityDefinitions.api_key.name}`,
      value: '{{apiKey}}',
    });
  }
  return headers;
}

function getStatusCode(code: string) {
  if (!code || code === "default") {
    return 200;
  }
  return code;
}

function getGlobalVariables(data: Partial<OpenAPI.Document>) {
  const variables: string[] = [];
  variables.push("url");

  if (data.securityDefinitions?.api_key) {
    variables.push("apiKey");
  }
  for (const [url, details] of Object.entries(data.paths)) {
    for (const [httpMethod, httpDetails] of Object.entries(details)) {
      for (const param of httpDetails.parameters) {
        if (param.in === "query" || param.in === "path") {
          const name = param.name;
          if (variables.indexOf(name) < 0) {
            variables.push(name);
          }
        }
      };
    };
  };
  return variables;
}
function getTestSuites(data) {
  const testSuites = [];

  for (const [path, values] of Object.entries(data.paths)) {
    const tests: Test[] = [];
    for (const [httpMethod, details] of Object.entries(values)) {
      for (const [codeName, codeDetails] of Object.entries(details.responses)) {
        const code = getStatusCode(codeName);
        let opPath = path;
        let paramsQuery = "";
        for (const param of details.parameters) {
          if (param.in === "query") {
            paramsQuery += `${param.name}={${param.name}}&`;
          }
        };

        if (paramsQuery.length > 1) {
          opPath = `${opPath}?${paramsQuery.substr(
            0,
            paramsQuery.lastIndexOf("&")
          )}`;
        }

        const params = details.parameters || [];
        tests.push({
          name: `${path} returns: ${codeDetails.description}`,
          description: `${path} returns: ${codeDetails.description}`,
          path: opPath,
          params: params,
          consumes: details.consumes || [],
          produces: details.produces || [],
          headers: generateHeaders(details, data),
          code: code,
          method: httpMethod,
          checks: {
            generateStatusCheckCode: true,
            generateRequestCode: true,
            needsAuthorization:
              details.security &&
              data.securityDefinitions &&
              data.securityDefinitions.api_key,
          },
        });
      };
    };

    if (tests.length > 0) {
      const testSuite = {
        name: path,
        description: `Tests for: ${path}`,
        tests: tests,
      };
      testSuites.push(testSuite);
    }
  };

  return testSuites;
}

export const transform = (
  request: { apiDefinition: OpenAPI.Document }
) => {
  const data = request.apiDefinition || {};
  const testSuites = getTestSuites(data);
  const title = data?.info?.title ?? "Service";
  const version = ` v${data?.info?.version}` ?? "";
  const variables = getGlobalVariables(data);

  return {
    testSuites: testSuites,
    variables: variables,
    name: `${title}${version}`,
    description: data?.info?.description ?? '',
    definitions: data.definitions || {},
    apiDefinition: data,
  };
};
