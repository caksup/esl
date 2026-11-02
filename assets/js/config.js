const DEPLOYED_API_URL = 'https://script.google.com/macros/s/AKfycbzHXoQvpCOmBkQeexD7lLbCmcptpp-SaF8DMP_jgBDwi4Pa0rgeKJ5HUVqdU2xcC1dB/exec'; // Paste the deployed Google Apps Script /exec URL here before publishing to GitHub Pages.

const STORED_API_URL = localStorage.getItem('jec_esl_api_url');

export const APP = {
  name: 'JEC ESL Game Hub',
  organization: 'Jagat Education Center',
  version: '2.0.0',
  apiUrl: STORED_API_URL === null ? DEPLOYED_API_URL : STORED_API_URL,
  adminTokenKey: 'jec_esl_admin_token',
  studentTokenKey: 'jec_esl_student_token',
  studentInfoKey: 'jec_esl_student_info',
  adminPinLocalKey: 'jec_esl_demo_admin_pin',
  defaultAdminPin: '2468', // Demo only; change ADMIN_PIN in Apps Script before deployment.
  defaultStudentPin: '1234',
};
export function setApiUrl(url) {
  APP.apiUrl = (url || '').trim();
  localStorage.setItem('jec_esl_api_url', APP.apiUrl);
}
