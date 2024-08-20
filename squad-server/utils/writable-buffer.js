import { Writable } from 'stream';

export class WritableBuffer extends Writable {
  constructor(options) {
    super(options);
    this.data = [];
  }

  _write(chunk, encoding, callback) {
    this.data.push(chunk);
    callback();
  }

  getBuffer() {
    return Buffer.concat(this.data);
  }

  toString(encoding = 'utf8') {
    return this.getBuffer().toString(encoding);
  }
}
export default WritableBuffer;
