class RandomString{
  constructor(){
    var self = this;
    self.name = "RandomString";
    self.namespace = self.name+':';
    self.generateRandomString = (length) =>{
    	if(length && length>16){
    		length = 16;
    	}else{
    		length = 16;
    	}

    	var text = "";
	    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	    for(var i = 0; i < length; i++) {
	        text += possible.charAt(Math.floor(Math.random() * possible.length));
	    }
	    return text;
    }
    self.hashString = (str) =>{
	  var hash = 5381,
	      i    = str.length;
	  while(i) {
	    hash = (hash * 33) ^ str.charCodeAt(--i);
	  }
	  /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
	   * integers. Since we want the results to be always positive, convert the
	   * signed int to an unsigned by doing an unsigned bitshift. */
	  return hash >>> 0;
    }
    self.randomHash = (length) =>{
    	return self.hashString(self.generateRandomString(length));
    }
  }
}
export default RandomString;