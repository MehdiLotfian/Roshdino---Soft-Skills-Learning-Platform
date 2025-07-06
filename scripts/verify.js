const fs = require('fs');
const path = require('path');

console.log('🔍 Roshdino Installation Verification');
console.log('=====================================\n');

// Check if required files exist
const requiredFiles = [
    'server.js',
    'package.json',
    'env.example',
    'README.md',
    'INSTALLATION.md',
    'models/User.js',
    'models/Quiz.js',
    'models/QuizResult.js',
    'middleware/auth.js',
    'routes/auth.js',
    'routes/quizzes.js',
    'routes/leaderboard.js',
    'routes/certificates.js',
    'routes/users.js',
    'routes/reports.js',
    'scripts/seed.js',
    'public/index.html',
    'uploads/certificates'
];

console.log('📁 Checking required files...');
let missingFiles = [];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        missingFiles.push(file);
    }
});

// Check package.json dependencies
console.log('\n📦 Checking package.json...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const requiredDependencies = [
        'express',
        'mongoose',
        'bcryptjs',
        'jsonwebtoken',
        'cors',
        'dotenv',
        'multer',
        'socket.io',
        'express-rate-limit',
        'helmet',
        'express-validator',
        'nodemailer',
        'pdfkit',
        'canvas'
    ];

    const missingDeps = requiredDependencies.filter(dep => !packageJson.dependencies[dep]);
    
    if (missingDeps.length === 0) {
        console.log('✅ All required dependencies found');
    } else {
        console.log('❌ Missing dependencies:', missingDeps.join(', '));
    }

    // Check scripts
    const requiredScripts = ['start', 'dev', 'seed'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
    
    if (missingScripts.length === 0) {
        console.log('✅ All required scripts found');
    } else {
        console.log('❌ Missing scripts:', missingScripts.join(', '));
    }

} catch (error) {
    console.log('❌ Error reading package.json:', error.message);
}

// Check environment file
console.log('\n🔧 Checking environment configuration...');
if (fs.existsSync('.env')) {
    console.log('✅ .env file exists');
    
    const envContent = fs.readFileSync('.env', 'utf8');
    const requiredEnvVars = [
        'PORT',
        'MONGODB_URI',
        'JWT_SECRET',
        'JWT_EXPIRES_IN'
    ];

    const missingEnvVars = requiredEnvVars.filter(varName => !envContent.includes(varName));
    
    if (missingEnvVars.length === 0) {
        console.log('✅ All required environment variables found');
    } else {
        console.log('❌ Missing environment variables:', missingEnvVars.join(', '));
    }
} else {
    console.log('❌ .env file not found - copy from env.example');
}

// Check directory structure
console.log('\n📂 Checking directory structure...');
const requiredDirs = [
    'models',
    'middleware',
    'routes',
    'scripts',
    'public',
    'uploads',
    'uploads/certificates'
];

requiredDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        console.log(`✅ ${dir}/`);
    } else {
        console.log(`❌ ${dir}/ - MISSING`);
    }
});

// Check Node.js version
console.log('\n🟢 Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion >= 16) {
    console.log(`✅ Node.js version: ${nodeVersion} (>= 16.0.0)`);
} else {
    console.log(`❌ Node.js version: ${nodeVersion} (requires >= 16.0.0)`);
}

// Summary
console.log('\n📊 Verification Summary');
console.log('========================');

if (missingFiles.length === 0) {
    console.log('✅ All required files are present');
} else {
    console.log(`❌ Missing ${missingFiles.length} files`);
    console.log('Missing files:', missingFiles.join(', '));
}

console.log('\n🎯 Next Steps:');
console.log('1. Install Node.js if not already installed');
console.log('2. Install MongoDB if not already installed');
console.log('3. Run: npm install');
console.log('4. Copy env.example to .env and configure');
console.log('5. Run: npm run seed (optional)');
console.log('6. Run: npm run dev');

if (missingFiles.length === 0) {
    console.log('\n🎉 All checks passed! Your Roshdino backend is ready for installation.');
} else {
    console.log('\n⚠️  Some files are missing. Please ensure all files are present before installation.');
}

console.log('\n📚 For detailed installation instructions, see INSTALLATION.md'); 