class Report {

  /*ws(){
    let out = "";
    for(let i = 0; i < this.depth; i++){
      out = out + " ";
    }
    return out;
  };*/

  jasmineStarted(suiteInfo) {
    //console.log('Total Suites: ' + suiteInfo.totalSpecsDefined.toString());
  };

  suiteStarted(result) {
    //console.log(this.ws() + result.description);
  };

  specStarted(result) {
    //console.log(this.ws() + result.description);
  };

  specDone(result) {
    let goodStr = '';
    if(result.failedExpectations.length === 0){
      return;
    }
    console.log("\x1b[31mFailure\x1b[0m: %s", result.fullName);
    result.failedExpectations.forEach((e) => {
      console.log("   %s", e.message);
      console.log("     Expected: %s", e.expected);
      console.log("     Actual:   %s", e.actual);
    })
  };

  suiteDone(result) {
    //this.depth = this.depth - 1;
  };

  jasmineDone(result) {
    console.log('Finished suite: ' + result.overallStatus);
  }
};

module.exports = Report;
