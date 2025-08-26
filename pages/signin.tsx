import { useState } from 'react';
import { signIn } from '../lib/auth';

const SignInPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        const { user, error } = await signIn(email, password);
        if (error) {
            console.error('Erreur de connexion:', error.message);
        } else {
            console.log('Utilisateur connecté:', user);
        }
    };

    return (
        <form onSubmit={handleSignIn}>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                required
            />
            <button type="submit">Se connecter</button>
        </form>
    );
};

export default SignInPage; 