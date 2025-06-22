use dep::poseidon::poseidon2::Poseidon2;

fn main(
    password: Field,
    user_tag_hash: Field,
    session_nonce: Field,
    password_hash: Field,
    nullifier_out: Field
) {
    let computed_hash = Poseidon2::hash([password, user_tag_hash], 2);
    assert(computed_hash == password_hash);

    let computed_nullifier = Poseidon2::hash([password, session_nonce, user_tag_hash], 3);
    assert(computed_nullifier == nullifier_out);
}
