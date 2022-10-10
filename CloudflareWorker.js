const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};
const corsHeadersKeys = Object.keys(corsHeaders);

function errorResponse(message) {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      'X-Yandex-Status': message,
    },
  });
}

async function handleRequest(request, pathname) {
  const requestInfo = await request.json();
  if (requestInfo.headers === undefined || 
      requestInfo.headers === null || 
      requestInfo.body === undefined || 
      requestInfo.body === null)
    return errorResponse('error-request');

  const yandexRequest = new Request('https://api.browser.yandex.ru' + pathname, {
    body: requestInfo.body,
    method: 'POST',
    headers: requestInfo.headers
  });
  
  let response = await fetch(yandexRequest);
  response = new Response(response.body, response);
  for (const corsHeaderKey of corsHeadersKeys)
    response.headers.set(corsHeaderKey, corsHeaders[corsHeaderKey]);
  response.headers.set('X-Yandex-Status', 'success');
  return response;
}

addEventListener('fetch', event => {
  const request = event.request;
  
  if (request.method == 'OPTIONS')
    return event.respondWith(new Response(null, {
      headers : {
        ...corsHeaders,
        'Allow': 'POST, OPTIONS',
      }
    }));

  if (request.method !== 'POST')
    return event.respondWith(errorResponse('error-method'));

  const pathname = new URL(request.url).pathname;
  if (pathname !== '/video-translation/translate')
    return event.respondWith(errorResponse('error-path'));

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json'))
    return event.respondWith(errorResponse('error-content'));

  return event.respondWith(handleRequest(request, pathname));
});
