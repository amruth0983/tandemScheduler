module.exports = {
    write: write
};

/**
 * Wrapper function to log information.
 */
function write() {

    var now = new Date().toString();

    if (typeof arguments !== "undefined" && arguments.length > 0) {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(now);
        console.log.apply(console, args);
        return true;
    }

    return false;
}

// http://stackoverflow.com/a/25867340
