'use strict';

const childProcess = require('child_process');
const KEY_REGEXP = /^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw480]=$/

module.exports = class Util {

  static isValidIPv4(str) {
    const blocks = str.split('.');
    if (blocks.length !== 4) return false;

    for (let value of blocks) {
      value = parseInt(value, 10);
      if (Number.isNaN(value)) return false;
      if (value < 0 || value > 255) return false;
    }

    return true;
  }

  /**
   * 
   * @param {string} str 
   * @returns 
   */
  static isValidSubnet(str) {
    str = str.trim();
    if (str.length === 0) return true;

    const blocks = str.split(',');
    if (blocks.length !== 1) {
      let ok = true
      for (let value of blocks) {
        ok = ok && Util.isValidSubnet(value);
      }
      if (!ok) {
        return false
      }
    } else {
      const parts = str.split('/');
      if (parts.length !== 2) return false;
      const mask = parseInt(parts[1], 10);
      if (Number.isNaN(mask)) return false;
      if (mask < 0 || mask > 32) return false;
      if (!Util.isValidIPv4(parts[0])) return false;
    }

    return true;
  }

  /**
   * TODO: Implement
   * @param {string} str 
   * @returns 
   */
  static isValidEndpoint(str) {
    return true
  }

  /**
   * 
   * @param {string} str 
   * @returns 
   */
  static async isValidKey(str) {
    return KEY_REGEXP.test(str)
  }

  static promisify(fn) {
    // eslint-disable-next-line func-names
    return function(req, res) {
      Promise.resolve().then(async () => fn(req, res))
        .then(result => {
          if (res.headersSent) return;

          if (typeof result === 'undefined') {
            return res
              .status(204)
              .end();
          }

          return res
            .status(200)
            .json(result);
        })
        .catch(error => {
          if (typeof error === 'string') {
            error = new Error(error);
          }

          // eslint-disable-next-line no-console
          console.error(error);

          return res
            .status(error.statusCode || 500)
            .json({
              error: error.message || error.toString(),
              stack: error.stack,
            });
        });
    };
  }

  static async exec(cmd, {
    log = true,
  } = {}) {
    if (typeof log === 'string') {
      // eslint-disable-next-line no-console
      console.log(`$ ${log}`);
    } else if (log === true) {
      // eslint-disable-next-line no-console
      console.log(`$ ${cmd}`);
    }

    if (process.platform !== 'linux') {
      return '';
    }

    return new Promise((resolve, reject) => {
      childProcess.exec(cmd, {
        shell: 'bash',
      }, (err, stdout) => {
        if (err) return reject(err);
        return resolve(String(stdout).trim());
      });
    });
  }

};
