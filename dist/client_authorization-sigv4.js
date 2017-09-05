//Implement SwaggerJS ClientAuthorization interface
var AWSSigv4RequestSigner = function(credentialProvider, aws) {
  this.name = "sigv4";
  this.aws = aws;
  this.credentialProvider = credentialProvider;
};

AWSSigv4RequestSigner.prototype.apply = function(options, authorizations) {
  var serviceName = "execute-api";

  //If we are loading the definition itself, then we need to sign for apigateway.
  if (typeof options != 'undefined' && options != null && options.url.indexOf("apigateway") >= 0) {
    serviceName = "apigateway";
  }

  if(serviceName == "apigateway" || (options.operation && options.operation.authorizations && options.operation.authorizations[0].sigv4))
  {
    /**
     * All of the below is an adapter to get this thing into the right form for the AWS JS SDK Signer
     */
    var parts = options.url.split('?');
    var host = parts[0].substr(8, parts[0].indexOf("/", 8) - 8);
    var path = parts[0].substr(parts[0].indexOf("/", 8));
    var querystring = parts[1];

    var now = new Date();
    if (!options.headers)
    {
     options.headers = [];
    }

    options.headers.host = host;
    if(serviceName == "apigateway")
    {
      //For the swagger endpoint, apigateway is strict about content-type
      options.headers.accept = "application/json";
    }

    options.pathname = function () {
      return path;
    };
    options.methodIndex = options.method;
    options.search = function () {
      return querystring ? querystring : "";
    };
    options.region = this.aws.config.region || 'us-east-1';

    //AWS uses CAPS for method names, but swagger does not.
    options.method = options.methodIndex.toUpperCase();

    var signer = new this.aws.Signers.V4(options, serviceName);


    //Actually add the Authorization header here
    signer.addAuthorization(this.credentialProvider, now);

    //SwaggerJS/yourbrowser complains if these are still around
    delete options.search;
    delete options.pathname;
    delete options.headers.host;
    return true;
  }
  return false;
};
