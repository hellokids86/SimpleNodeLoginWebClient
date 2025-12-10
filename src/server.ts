import 'dotenv/config';
import express from 'express';
import { sessionMiddleware } from './middleware/sessionMiddleware';
import { requireAuth, requireRole } from './middleware/authMiddleware';
import authRoutes from './auth/AuthRoutes';




async function main() {
    console.log('🚀 Starting TaskScheduler Application...');

        // Initialize the task scheduler
     

console.log('🔧 Initializing server...', process.env.PORT);
        const port = parseInt(process.env.PORT || '3000');

        const app = express();

        // Apply session middleware globally
        app.use(sessionMiddleware);

        // Mount auth routes
        app.use('/auth', authRoutes);

        // Add default route for index page
        app.get('/', (req, res) => {
            res.send('Hello World');
        });

              // Add default route for index page
        app.get('/secure', requireAuth, (req, res) => {
            res.send('Secure Hello World');
        });

                   // Add default route for index page
        app.get('/admin', requireAuth, requireRole('admin'), (req, res) => {
            res.send('Admin Hello World');
        });


        // Start listening on the port
        app.listen(port, () => {
            console.log(`🌐 Server listening on port ${port}`);
 
            console.log(`🏠 Home page available at: http://localhost:${port}`);
            console.log(`🏠 Admin available at: http://localhost:${port}/admin`);
            console.log(`🏠 Home page available at: http://localhost:${port}/secure`);
        });


        console.log('✅ TaskScheduler Application started successfully!');

     

  
}


// Start the application
main();
