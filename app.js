const express = require("express");
const Generate = require("./Generator");
const app = express();

app.get("/", (req, res) => {
  /**
   * Please change the value n and regexp to check the Generate function
   */

  let n = 10;
  let regexp = "/[-+]?[0-9]{1,16}[.][0-9]{1,6}/"; //(1[0-2]|0[1-9])(:[0-5][0-9]){2} (A|P)M
  const result = Generate(regexp, n);
  /** 
   * console.log("The generated strings are",result)
   */


   /**
    * The following line sending the result at our browser screen
    * Please go to the browser and type "localhost:3000" so see the result on screen
    */
  res.send(JSON.stringify(result));
});

app.listen(3000, function () {
  console.log("server started..");
});
