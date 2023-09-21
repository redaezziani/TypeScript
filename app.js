//lets import all the moduls 

import chalk from 'chalk';
import inquirer from 'inquirer';
import ytdl from 'ytdl-core';
import fs from 'fs';
import * as p from '@clack/prompts';


async function downloadVideo(url, name, permission) {
  if (permission) {
    const info = await ytdl.getInfo(url);
    const format = ytdl.formatChooser(info.formats,{ quality: '134' });
    if (format) {
      ytdl(url, { format }).pipe(fs.createWriteStream(`${name}.mp4`));
    } else {
      console.log('The resolution you entered is not available or there was an issue with the format.');
    }
  }
}


const menuChoices = [
  {
    name: 'Download Video',
    value: 'video',
  },
  {
    name: 'Download Playlist',
    value: 'playlist',
  },
  {
    name: 'Exit',
    value: 'exit',
  },
];

async function displayMenu() {
  console.log(chalk.bold.red('Welcome to the Yt DownLoader Menu:'));

  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Select an option:',
      choices: menuChoices,
    },
  ]);

  switch (choice) {
    case 'video':
      //lets make a ask about the url of the video
      const {url}=await inquirer.prompt([
        {
          type:'input',
          name:'url',
          message:'Enter the url of the video you want to download'
        }
      ])
      //lets make him ask about the name of the video and the path to save it and the resolution like a 1080p or 720p or 480p select
      const {name}=await inquirer.prompt([
        {
          type:'input',
          name:'name',
          message:'Enter the name of the video'
        }
      ])
      const {resolution}=await inquirer.prompt([
        {
          type:'list',
          name:'resolution',
          message:'Enter the resolution of the video',
          choices:['1080p','720p','480p']
        }
      ])
      //lets make a bolean to ask the user give the permission to download the video in the main download folder in his computer
      const {permission}=await inquirer.prompt([
        {
          type:'confirm',
          name:'permission',
          message:'Do you want to download the video in the main download folder in your computer'
        }
      ])
      console.log(chalk.overline('\n downloading is starting...'));
      //lets add a progress bar to show the progress of the downloading
      const spiner=p.spinner();
      spiner.start();
      await downloadVideo(url, name, resolution, permission)
      spiner.stop();
      console.log('done ....')
      break;
    case 'playlist':
      console.log(chalk.green('Playing playlist...'));
      break;
    case 'exit':
      console.log(chalk.yellow('Exiting...'));
      break;
    default:
      console.log(chalk.red('Invalid choice. Please select a valid option.'));
  }
}

displayMenu();



//lets make a function to safe the video in a folder

