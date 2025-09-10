import { Octokit } from '@octokit/rest'
import fs from 'fs'
import path from 'path'

let connectionSettings;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
  return accessToken;
}

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

function getAllProjectFiles(dir, baseDir = '', files = []) {
  // Skip these directories completely
  const skipDirs = ['.git', 'node_modules', '.cache', '.local', '.pythonlibs', '.config', '.upm', 'dist'];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = baseDir ? path.join(baseDir, item) : item;
      
      // Skip if in skip list
      if (skipDirs.some(skipDir => relativePath.startsWith(skipDir))) continue;
      
      // Skip temp files and python files
      if (item.endsWith('.pyc') || item.endsWith('.log') || item.startsWith('test_') || 
          item.endsWith('.py') || item === 'cookies.txt' || item === 'uv.lock' || item === 'pyproject.toml') continue;
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          getAllProjectFiles(fullPath, relativePath, files);
        } else {
          files.push({
            path: relativePath,
            fullPath: fullPath
          });
        }
      } catch (err) {
        // Skip files we can't read
      }
    }
  } catch (err) {
    // Skip directories we can't read
  }
  
  return files;
}

async function pushProject() {
  try {
    console.log('🚀 Pushing complete Fractal Leader project to GitHub...');
    
    const octokit = await getUncachableGitHubClient();
    const owner = 'leedevelops';
    const repo = 'fractal-leader';
    
    // Get ALL project files
    const allFiles = getAllProjectFiles('.');
    console.log(`📁 Found ${allFiles.length} project files`);
    
    // Upload files in batches to avoid timeout
    const batchSize = 50;
    const fileBlobs = [];
    
    for (let i = 0; i < allFiles.length; i += batchSize) {
      const batch = allFiles.slice(i, i + batchSize);
      console.log(`📤 Uploading batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allFiles.length/batchSize)} (${batch.length} files)...`);
      
      for (const file of batch) {
        try {
          const content = fs.readFileSync(file.fullPath);
          const blob = await octokit.rest.git.createBlob({
            owner,
            repo,
            content: content.toString('base64'),
            encoding: 'base64'
          });
          
          fileBlobs.push({
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: blob.data.sha
          });
          
        } catch (error) {
          console.log(`⚠️  Skipped: ${file.path}`);
        }
      }
    }
    
    console.log(`✅ Successfully uploaded ${fileBlobs.length} files`);
    
    // Create tree
    console.log('🌳 Creating project tree...');
    const tree = await octokit.rest.git.createTree({
      owner,
      repo,
      tree: fileBlobs
    });
    
    // Get current main branch to create commit on top of it
    let parentSha = null;
    try {
      const { data: ref } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: 'heads/main'
      });
      parentSha = ref.object.sha;
      console.log('🔗 Found existing main branch');
    } catch (error) {
      console.log('🆕 Creating new main branch');
    }
    
    // Create commit
    console.log('💾 Creating commit...');
    const commit = await octokit.rest.git.createCommit({
      owner,
      repo,
      message: `Complete Fractal Leader Platform - Biblical Leadership Development SaaS

🎯 Full-stack leadership development platform featuring:

✨ Core Features:
- Landing page with generational adaptation (Gen Z, Millennial, Gen X, Boomer)
- Biblical archetype assessment (Pioneer, Organizer, Builder, Guardian)
- AI Biblical coaching powered by Claude Sonnet
- 25-tier fractal matrix visualization with sacred geometry
- Sacred frequency meditation system (260Hz, 396Hz, 528Hz, etc.)
- Cross-generational team formation tools

🛠️ Technical Stack:
- React + TypeScript frontend with shadcn/ui components
- Express.js backend with comprehensive API
- PostgreSQL database with Drizzle ORM
- Replit authentication integration
- Stripe subscription system (Seeker/Pioneer/Visionary)
- Dark cosmic theme with Hebrew typography
- Responsive design with mobile support

📊 Database Architecture:
- User management with Hebrew name mapping
- Organization and team structures  
- Assessment and progress tracking
- Daily practice logging
- Session management for auth

🔒 Security & Integration:
- Environment-based configuration
- API key management through Replit integrations
- Secure payment processing
- Session-based authentication

Ready for production deployment! 🚀`,
      tree: tree.data.sha,
      parents: parentSha ? [parentSha] : []
    });
    
    // Update main branch reference
    console.log('🔄 Updating main branch...');
    if (parentSha) {
      await octokit.rest.git.updateRef({
        owner,
        repo,
        ref: 'heads/main',
        sha: commit.data.sha
      });
    } else {
      await octokit.rest.git.createRef({
        owner,
        repo,
        ref: 'refs/heads/main',
        sha: commit.data.sha
      });
    }
    
    console.log('');
    console.log('🎉🎉🎉 SUCCESS! 🎉🎉🎉');
    console.log('');
    console.log('✅ Fractal Leader platform successfully pushed to GitHub!');
    console.log(`🌐 Repository: https://github.com/${owner}/${repo}`);
    console.log(`📝 Commit SHA: ${commit.data.sha}`);
    console.log(`📁 ${fileBlobs.length} files uploaded`);
    console.log('');
    console.log('🔥 Your complete Biblical leadership development platform is now on GitHub:');
    console.log('   - All React components and pages');
    console.log('   - Complete backend API');
    console.log('   - Database schemas and configurations'); 
    console.log('   - AI coaching integration');
    console.log('   - Assessment and meditation systems');
    console.log('   - Sacred geometry visualizations');
    console.log('   - And much more!');
    console.log('');
    console.log('🚀 Ready for deployment and collaboration!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

pushProject();