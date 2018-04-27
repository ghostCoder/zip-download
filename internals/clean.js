import del from 'del';

/**
 * Cleans up the output (build) directory.
 */
async function clean() {
  await del(['lib/*'], { dot: true });
}

export default clean;
