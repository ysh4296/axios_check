// 두 axios 버전을 npm alias로 동시에 설치
// package.json: "axios-vuln": "npm:axios@1.14.0", "axios": "^1.15.0"
import axiosVuln from 'axios-vuln';
import axiosFix  from 'axios';

export { axiosVuln, axiosFix };
export const VULN_VERSION = axiosVuln.VERSION; // '1.14.0'
export const FIX_VERSION  = axiosFix.VERSION;  // '1.15.0'
