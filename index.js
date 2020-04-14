

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

//Initialize HTML Rewriter
const HTML = new HTMLRewriter()
  .on('h1#title', { element: e => e.setInnerContent('Kevin Babcock\'s Internship Application') })
  .on('a#url', {
    element: e => {
      e.setInnerContent('Visit my Github!')
      e.setAttribute('href', 'https://github.com/Kpfhorn')
    }
  })

/**
 * Function for checking for cookies
 * @param {Request} request 
 */
function checkCookies(request) {
  let cookies = request.headers.get('Cookie');
  let data = {
    status: false,
    variant: -1
  }
  if (cookies != null) {
    cookies = cookies.split(";")
    //check if split created an array and process single cookies
    if (typeof (cookies) == String) {
      cookies = cookies.split("=")
      if (cookies[0] == "variant") {
        data = {
          status: true,
          variant: cookies[1]
        }
      }
      //find variant cookie when multiple cookies are present
    } else {
      for (i in cookies) {
        cookies[i] = cookies[i].trim()
        cookies[i] = cookies[i].split("=")
      }
      for (i in cookies) {
        if (cookies[i][0] == "variant") {
          data = {
            status: true,
            variant: cookies[i][1]
          }
        }
      }
    }
  }
  return data;
}

/**
 * Direct requests to one of two variant pages
 * @param {Request} request
 */
async function handleRequest(request) {
  //Check for cookies
  let cookieData = checkCookies(request)
  //get variant page
  let variant = await fetch('https://cfw-takehome.developers.workers.dev/api/variants')
    .then((response) => {
      return response.json()
    })
    .then((data) => {
      //Randomly assign a variant page
      //use previous variant if cookie is present
      let n = Math.random();
      let variant = {}
      if (cookieData.status === true) {
        variant = {
          index: cookieData.variant,
          url: data.variants[cookieData.variant - 1]
        }
      }
      else if (n > .5) {
        variant = {
          url: data.variants[0],
          index: 1
        }
      } else {
        variant = {
          url: data.variants[1],
          index: 2
        }
      }
      return variant
    })
  //Fetch variant page
  let res = await fetch(variant.url)
    .then((response) => {
      //if cookie is not present, set variant cookie
      if (cookieData.status === false) {
        let init = {
          headers: new Headers({
            'Set-Cookie': 'variant=' + variant.index
          })
        }
        let res = new Response(response.body, init)
        return res
      }
      else return response
    })
  //return modified response
  return HTML.transform(res)

}


