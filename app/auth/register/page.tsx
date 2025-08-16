import { Container, Box } from '@mui/material';
import RegisterForm from './RegisterForm';

export default function RegisterPage() {
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <RegisterForm />
      </Box>
    </Container>
  );
}