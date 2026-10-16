const { setLogLevel } = require('firebase/firestore')

// Every `assertFails` case produces an expected PERMISSION_DENIED, and the
// client SDK logs each one as a warning with a full gRPC stack. Silencing the
// SDK is what makes a real failure readable in the output.
setLogLevel('silent')
