import { SQUADJS_VERSION, COPYRIGHT_MESSAGE } from '../constants.js';

const LOGO = `
   _____  ____  _    _         _____   _     
  / ____|/ __ \\| |  | |  /\\   |  __ \\ (_)    
 | (___ | |  | | |  | | /  \\  | |  | | _ ___ 
  \\___ \\| |  | | |  | |/ /\\ \\ | |  | || / __|
  ____) | |__| | |__| / ____ \\| |__| || \\__ \\
 |_____/ \\___\\_\\\\____/_/    \\_\\_____(_) |___/
                                     _/ |    
                                    |__/     
${COPYRIGHT_MESSAGE}
GitHub: https://github.com/Thomas-Smyth/SquadJS
Version: ${SQUADJS_VERSION}
`;

export default function () {
  console.log(LOGO);
}
