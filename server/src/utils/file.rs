use md5::{Digest, Md5};
use std::fs::File;
use std::io::{BufReader, Read};

pub fn compute_md5<P: AsRef<std::path::Path>>(path: P) -> std::io::Result<String> {
    let file = File::open(path)?;
    let mut reader = BufReader::new(file);
    let mut hasher = Md5::new();
    let mut buffer = [0u8; 4096];

    loop {
        let count = reader.read(&mut buffer)?;
        if count == 0 {
            break;
        }
        hasher.update(&buffer[..count]);
    }

    let result = hasher.finalize();
    Ok(format!("{:x}", result))
}
