// "axios-vuln": "npm:axios@1.14.0", "axios": "^1.15.0"
import axiosVuln from 'axios-vuln';
import axiosFix from 'axios';

export { axiosVuln, axiosFix };
export const VULN_VERSION: string = axiosVuln.VERSION;
export const FIX_VERSION: string = axiosFix.VERSION;
