import { Octokit } from '@octokit/rest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

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

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

interface FileData {
  path: string;
  content: string;
  encoding: 'utf-8' | 'base64';
}

// Get all files in the project (excluding certain directories)
function getAllFiles(dir: string, baseDir: string, excludePatterns: string[] = []): FileData[] {
  const files: FileData[] = [];
  const entries = readdirSync(dir);
  
  const defaultExcludes = [
    'node_modules',
    '.git', 
    '.replit',
    'dist',
    '.next',
    '.nuxt',
    '.vercel',
    'coverage',
    '__pycache__',
    '.pytest_cache',
    'cookies.txt',
    'uv.lock',
    '.env',
    '.env.local'
  ];
  
  const allExcludes = [...defaultExcludes, ...excludePatterns];
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const relativePath = relative(baseDir, fullPath);
    
    // Skip excluded directories and files
    if (allExcludes.some(pattern => 
      relativePath.includes(pattern) || 
      entry.startsWith('.') && !entry.includes('.ts') && !entry.includes('.js') && !entry.includes('.json')
    )) {
      continue;
    }
    
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir, excludePatterns));
    } else if (stat.isFile() && stat.size < 1024 * 1024) { // Skip files larger than 1MB
      try {
        const content = readFileSync(fullPath, 'utf8');
        files.push({
          path: relativePath.replace(/\\/g, '/'), // Normalize path separators
          content,
          encoding: 'utf-8'
        });
      } catch (error) {
        // Skip files that can't be read as text
        console.warn(`Skipping file ${relativePath}: ${error}`);
      }
    }
  }
  
  return files;
}

export interface UploadOptions {
  repoName: string;
  description?: string;
  private?: boolean;
  baseDir?: string;
  excludePatterns?: string[];
}

export async function uploadProjectToGitHub(options: UploadOptions) {
  const { 
    repoName, 
    description = 'Fractal Leader - Biblical Leadership Development SaaS Platform',
    private: isPrivate = false,
    baseDir = process.cwd(),
    excludePatterns = []
  } = options;
  
  console.log('🚀 Starting GitHub upload process...');
  
  try {
    // Get GitHub client
    const octokit = await getUncachableGitHubClient();
    
    // Get authenticated user
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log(`📝 Authenticated as: ${user.login}`);
    
    // Check if repository exists
    let repo;
    try {
      const { data: existingRepo } = await octokit.rest.repos.get({
        owner: user.login,
        repo: repoName
      });
      repo = existingRepo;
      console.log(`📦 Using existing repository: ${repo.html_url}`);
    } catch (error: any) {
      if (error.status === 404) {
        // Create new repository
        console.log(`🏗️  Creating new repository: ${repoName}`);
        const { data: newRepo } = await octokit.rest.repos.createForAuthenticatedUser({
          name: repoName,
          description,
          private: isPrivate,
          auto_init: false
        });
        repo = newRepo;
        console.log(`✅ Repository created: ${repo.html_url}`);
      } else {
        throw error;
      }
    }
    
    // Get all project files
    console.log('📁 Gathering project files...');
    const files = getAllFiles(baseDir, baseDir, excludePatterns);
    console.log(`📄 Found ${files.length} files to upload`);
    
    // Create initial commit with all files
    const commitMessage = `Initial commit: Fractal Leader SaaS Platform

Features:
- Hebrew matrix background animation
- Streamlined landing page flow  
- Biblical archetype assessment system
- React frontend with TypeScript
- Express backend with PostgreSQL
- Stripe integration for subscriptions
- Claude AI integration for guidance
- Sacred geometry and frequency meditation
- Multi-generational team formation tools

Built with modern full-stack architecture for biblical leadership development.`;

    // Get the default branch (usually main or master)
    let defaultBranch = 'main';
    try {
      const { data: repoData } = await octokit.rest.repos.get({
        owner: user.login,
        repo: repoName
      });
      defaultBranch = repoData.default_branch || 'main';
    } catch (error) {
      // If repo is empty, default to 'main'
      defaultBranch = 'main';
    }
    
    // Check if the branch exists and has commits
    let parentSha: string | undefined;
    try {
      const { data: ref } = await octokit.rest.git.getRef({
        owner: user.login,
        repo: repoName,
        ref: `heads/${defaultBranch}`
      });
      parentSha = ref.object.sha;
    } catch (error: any) {
      if (error.status !== 404) {
        throw error;
      }
      // Branch doesn't exist, we'll create it
    }
    
    // Create blobs for all files
    console.log('📤 Uploading files to GitHub...');
    const tree = [];
    
    for (const file of files) {
      const { data: blob } = await octokit.rest.git.createBlob({
        owner: user.login,
        repo: repoName,
        content: file.content,
        encoding: file.encoding
      });
      
      tree.push({
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.sha
      });
    }
    
    // Create tree
    const { data: treeData } = await octokit.rest.git.createTree({
      owner: user.login,
      repo: repoName,
      tree,
      base_tree: parentSha // This will be undefined for first commit
    });
    
    // Create commit
    const { data: commit } = await octokit.rest.git.createCommit({
      owner: user.login,
      repo: repoName,
      message: commitMessage,
      tree: treeData.sha,
      parents: parentSha ? [parentSha] : []
    });
    
    // Update reference (or create it if it doesn't exist)
    try {
      await octokit.rest.git.updateRef({
        owner: user.login,
        repo: repoName,
        ref: `heads/${defaultBranch}`,
        sha: commit.sha
      });
    } catch (error: any) {
      if (error.status === 422) {
        // Reference doesn't exist, create it
        await octokit.rest.git.createRef({
          owner: user.login,
          repo: repoName,
          ref: `refs/heads/${defaultBranch}`,
          sha: commit.sha
        });
      } else {
        throw error;
      }
    }
    
    console.log('✅ Upload completed successfully!');
    console.log(`🔗 Repository URL: ${repo.html_url}`);
    console.log(`📊 Uploaded ${files.length} files`);
    console.log(`💾 Commit SHA: ${commit.sha}`);
    
    return {
      success: true,
      repoUrl: repo.html_url,
      commitSha: commit.sha,
      filesUploaded: files.length,
      repoName: repo.full_name
    };
    
  } catch (error: any) {
    console.error('❌ Upload failed:', error.message);
    throw error;
  }
}

// CLI interface
export async function runUpload() {
  try {
    const result = await uploadProjectToGitHub({
      repoName: 'fractal-leader',
      description: 'Fractal Leader - Biblical Leadership Development SaaS Platform with Hebrew matrix animations and multi-generational team formation tools',
      private: false, // Set to true if you want a private repo
      excludePatterns: ['*.log', 'temp/', '.tmp/']
    });
    
    console.log('\n🎉 GitHub upload completed!');
    console.log(`🔗 Your repository is available at: ${result.repoUrl}`);
    
    return result;
  } catch (error: any) {
    console.error('\n💥 Upload failed:', error.message);
    process.exit(1);
  }
}

// If this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runUpload();
}