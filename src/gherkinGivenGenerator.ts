type Test = {
  checks: {
    needsAuthorization: boolean,
    generateRequestCode: boolean,
  },
  method: 'get',
  params: {
    in: string,
    name: string,
    path: string,
    schema: {
      $ref: string,
      type?: never
    } | {
      $ref?: never,
      type: string,
      items: {
        $ref: string
      }
    }
  }[]
}

export function generate(test: Test) {
  const requestType = test.checks.needsAuthorization ? '"authorized"' : '"unauthorized"';

  console.log(test)
  
  if (
    test.method === "get"
    || !test.checks.generateRequestCode
    || test.params.length === 0
    || (
      test.params.length === test.params.filter(p => p.in && p.path).length
    )
  ) {
    return `Given I have ${requestType} request`;
  }

  if (test.params.length === 1 && test.params[0].in === "body") {
    const bodyParam = test.params[0];

    if (bodyParam.schema?.$ref && !bodyParam.schema.type) {
      return `Given I have ${requestType} request of type "${bodyParam.schema.$ref.replace('#/definitions/', '')}"`;
    }

    if (bodyParam.schema?.type && bodyParam.schema.type === 'array' && bodyParam.schema.items.$ref) {
      return `Given I have ${requestType} request with an array of type "${bodyParam.schema.items.$ref.replace('#/definitions/', '')}"`;
    }

    return `Given I have ${requestType} request of type "${bodyParam.name}"`;
  }
}
