import crypto from 'crypto';

export const Decrypt = (text: any) => {
    const ENCRYPTION_KEY = "5v8x/A?D(G+KbPeShVmYq3t6w9z$B&E)";
    let parts = text.split(':');
    let iv = Buffer.from(parts.shift(), 'hex');
    let encrypted = Buffer.from(parts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

export const DecodeCipher = (s: any, n: any) => {
	let alphabet = 'abcdefghijklmnopqrstuvwxyz'
	let lc = alphabet.replace(/\s/g, '').toLowerCase().split('')
	let uc = alphabet.replace(/\s/g, '').toUpperCase().split('')

	return Array.from(s).map((v: any) => {
		if (lc.indexOf(v.toLowerCase()) === -1 || uc.indexOf(v.toUpperCase()) === -1) { return v }

		let lcEncryptIndex = (lc.indexOf(v.toLowerCase()) - n) % alphabet.length
		lcEncryptIndex = lcEncryptIndex < 0 ? lcEncryptIndex + alphabet.length : lcEncryptIndex
		const lcEncryptedChar = lc[lcEncryptIndex]

		let ucEncryptIndex = (uc.indexOf(v.toUpperCase()) - n) % alphabet.length
		ucEncryptIndex = ucEncryptIndex < 0 ? ucEncryptIndex + alphabet.length : ucEncryptIndex
		const ucEncryptedChar = uc[ucEncryptIndex]

		return lc.indexOf(v) !== -1 ? lcEncryptedChar : ucEncryptedChar
	}).join('')
}