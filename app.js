//lets import all the moduls 

import chalk from 'chalk';
import inquirer from 'inquirer';
import ytdl from 'ytdl-core';
import fs from 'fs';
import * as p from '@clack/prompts';

async function downloadVideo(url, name, permission) {
    if (permission) {
      try {
        const info = await ytdl.getInfo(url);
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });
        
        if (!format) {
          throw new Error('Could not find a suitable format for download.');
        }
  
        const video = ytdl(url, { format });
        const outputFilePath = `./videos/${name}.mp4`;
  
        video.pipe(fs.createWriteStream(outputFilePath));
        
        video.on('end', () => {
          console.log(`Video downloaded successfully to ${outputFilePath}`);
        });
  
        video.on('error', (err) => {
          console.error('Error downloading video:', err);
        });
      } catch (err) {
        console.error('Error getting video info:', err);
      }
    } else {
      console.error('Permission denied to download the video.');
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
      const {permission} =await inquirer.prompt([
        {
          type:'confirm',
          name:'permission',
          message:'Do you want to download the video in the main download folder in your computer'
        }
      ])
      console.log(chalk.overline('\n downloading is starting...'));
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


